package com.workfood_kot.usb

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors
import kotlin.math.min

internal class UsbPrinterException(
    val errorCode: String,
    message: String,
) : Exception(message)

internal inline fun <Connection, Resource, Result> withClaimedUsbResource(
    open: () -> Connection?,
    resource: Resource,
    claim: (Connection, Resource) -> Boolean,
    operation: (Connection, Resource) -> Result,
    release: (Connection, Resource) -> Unit,
    close: (Connection) -> Unit,
): Result {
  val connection =
      open()
          ?: throw UsbPrinterException(
              "USB_OPEN_FAILED",
              "Android could not open the selected USB device.",
          )
  var claimed = false

  try {
    claimed = claim(connection, resource)
    if (!claimed) {
      throw UsbPrinterException(
          "USB_CLAIM_FAILED",
          "Android could not claim the selected USB interface.",
      )
    }

    return operation(connection, resource)
  } finally {
    try {
      if (claimed) {
        release(connection, resource)
      }
    } finally {
      close(connection)
    }
  }
}

internal fun writeSequentialChunks(
    totalBytes: Int,
    chunkSize: Int,
    transfer: (offset: Int, requestedBytes: Int) -> Int,
): Int {
  if (totalBytes <= 0) {
    throw UsbPrinterException("USB_DATA_EMPTY", "USB printer data is empty.")
  }
  if (chunkSize <= 0) {
    throw UsbPrinterException("USB_INVALID_PACKET_SIZE", "USB write chunk size is invalid.")
  }

  var offset = 0
  var transfers = 0

  while (offset < totalBytes) {
    val requestedBytes = min(chunkSize, totalBytes - offset)
    val transferredBytes = transfer(offset, requestedBytes)

    if (transferredBytes <= 0 || transferredBytes > requestedBytes) {
      throw UsbPrinterException(
          "USB_WRITE_FAILED",
          "USB transfer failed after $offset of $totalBytes bytes. The receipt was not retried.",
      )
    }

    offset += transferredBytes
    transfers += 1
  }

  return transfers
}

@ReactModule(name = UsbPrinterModule.NAME)
class UsbPrinterModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private data class WritablePath(
      val usbInterface: UsbInterface,
      val endpoint: UsbEndpoint,
      val classification: String,
  )

  private val usbManager =
      reactContext.getSystemService(Context.USB_SERVICE) as UsbManager
  private val worker = Executors.newSingleThreadExecutor()
  private val permissionLock = Any()
  private var permissionReceiver: BroadcastReceiver? = null
  private var permissionPromise: Promise? = null
  private var eventReceiverRegistered = false

  private val usbEventReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val device = intent.usbDeviceExtra() ?: return
          val eventName =
              when (intent.action) {
                UsbManager.ACTION_USB_DEVICE_ATTACHED -> EVENT_DEVICE_ATTACHED
                UsbManager.ACTION_USB_DEVICE_DETACHED -> EVENT_DEVICE_DETACHED
                else -> return
              }

          emitDeviceEvent(eventName, deviceToMap(device))
        }
      }

  init {
    registerUsbEventReceiver()
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by React Native's NativeEventEmitter contract.
  }

  @ReactMethod
  fun removeListeners(count: Double) {
    // Required by React Native's NativeEventEmitter contract.
  }

  @ReactMethod
  fun isUsbHostSupported(promise: Promise) {
    promise.resolve(
        reactApplicationContext.packageManager.hasSystemFeature(
            PackageManager.FEATURE_USB_HOST,
        )
    )
  }

  @ReactMethod
  fun getConnectedDevices(promise: Promise) {
    worker.execute {
      try {
        val devices = Arguments.createArray()
        usbManager.deviceList.values.sortedBy { it.deviceName }.forEach { device ->
          devices.pushMap(deviceToMap(device))
        }
        promise.resolve(devices)
      } catch (error: Exception) {
        reject(promise, error, "USB_ENUMERATION_FAILED")
      }
    }
  }

  @ReactMethod
  fun hasPermission(deviceName: String, promise: Promise) {
    try {
      promise.resolve(usbManager.hasPermission(requireDevice(deviceName)))
    } catch (error: Exception) {
      reject(promise, error, "USB_DEVICE_NOT_FOUND")
    }
  }

  @ReactMethod
  fun requestPermission(deviceName: String, promise: Promise) {
    val device =
        try {
          requireDevice(deviceName)
        } catch (error: Exception) {
          reject(promise, error, "USB_DEVICE_NOT_FOUND")
          return
        }

    if (usbManager.hasPermission(device)) {
      promise.resolve(true)
      return
    }

    synchronized(permissionLock) {
      if (permissionPromise != null) {
        promise.reject(
            "USB_PERMISSION_IN_PROGRESS",
            "Another USB permission request is already in progress.",
        )
        return
      }

      val action = "${reactApplicationContext.packageName}.USB_PRINTER_PERMISSION"
      val receiver =
          object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
              if (intent.action != action) {
                return
              }

              val receivedDevice = intent.usbDeviceExtra()
              if (receivedDevice?.deviceName != deviceName) {
                return
              }

              val granted =
                  intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false) &&
                      usbManager.hasPermission(device)
              val pendingPromise: Promise?

              synchronized(permissionLock) {
                pendingPromise = permissionPromise
                permissionPromise = null
                permissionReceiver = null
              }

              unregisterPermissionReceiver(this)
              pendingPromise?.resolve(granted)
            }
          }

      try {
        registerPermissionReceiver(receiver, IntentFilter(action))
        permissionReceiver = receiver
        permissionPromise = promise

        val permissionIntent =
            PendingIntent.getBroadcast(
                reactApplicationContext,
                0,
                Intent(action).setPackage(reactApplicationContext.packageName),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        usbManager.requestPermission(device, permissionIntent)
      } catch (error: Exception) {
        permissionReceiver = null
        permissionPromise = null
        unregisterPermissionReceiver(receiver)
        reject(promise, error, "USB_PERMISSION_REQUEST_FAILED")
      }
    }
  }

  @ReactMethod
  fun testConnection(deviceName: String, promise: Promise) {
    worker.execute {
      try {
        val device = requirePermittedDevice(deviceName)
        val path = findWritablePath(device)

        withClaimedPath(device, path) { _, _ -> Unit }

        promise.resolve(operationResult(device, path, 0, 0, "USB printer connection successful."))
      } catch (error: Exception) {
        reject(promise, error, "USB_CONNECTION_FAILED")
      }
    }
  }

  @ReactMethod
  fun writeBase64(deviceName: String, base64Data: String, promise: Promise) {
    worker.execute {
      try {
        val data =
            try {
              Base64.decode(base64Data, Base64.DEFAULT)
            } catch (error: IllegalArgumentException) {
              throw UsbPrinterException("USB_DATA_INVALID", "USB printer data is not valid Base64.")
            }
        val device = requirePermittedDevice(deviceName)
        val path = findWritablePath(device)
        var transferCount = 0

        withClaimedPath(device, path) { connection, writablePath ->
          val chunkSize = maxOf(DEFAULT_WRITE_CHUNK_SIZE, writablePath.endpoint.maxPacketSize)
          transferCount =
              writeSequentialChunks(data.size, chunkSize) { offset, requestedBytes ->
                connection.bulkTransfer(
                    writablePath.endpoint,
                    data,
                    offset,
                    requestedBytes,
                    WRITE_TIMEOUT_MS,
                )
              }
        }

        promise.resolve(
            operationResult(
                device,
                path,
                data.size,
                transferCount,
                "Receipt sent to USB printer.",
            )
        )
      } catch (error: Exception) {
        reject(promise, error, "USB_WRITE_FAILED")
      }
    }
  }

  override fun invalidate() {
    synchronized(permissionLock) {
      permissionPromise?.reject(
          "USB_MODULE_INVALIDATED",
          "USB permission request was cancelled because the USB module stopped.",
      )
      permissionPromise = null
      permissionReceiver?.let(::unregisterPermissionReceiver)
      permissionReceiver = null
    }
    unregisterUsbEventReceiver()
    worker.shutdownNow()
    super.invalidate()
  }

  private fun requireDevice(deviceName: String): UsbDevice =
      usbManager.deviceList[deviceName]
          ?: throw UsbPrinterException(
              "USB_DEVICE_NOT_FOUND",
              "The selected USB device is no longer connected.",
          )

  private fun requirePermittedDevice(deviceName: String): UsbDevice {
    val device = requireDevice(deviceName)
    if (!usbManager.hasPermission(device)) {
      throw UsbPrinterException(
          "USB_PERMISSION_REQUIRED",
          "USB permission is required for the selected device.",
      )
    }
    return device
  }

  private fun classify(device: UsbDevice): String {
    if ((0 until device.interfaceCount).any {
          device.getInterface(it).interfaceClass == UsbConstants.USB_CLASS_PRINTER
        }) {
      return "printer_class"
    }

    if (device.vendorId in COMMON_SERIAL_VENDOR_IDS ||
        (0 until device.interfaceCount).any {
          device.getInterface(it).interfaceClass == UsbConstants.USB_CLASS_COMM ||
              device.getInterface(it).interfaceClass == UsbConstants.USB_CLASS_CDC_DATA
        }) {
      return "usb_serial"
    }

    if ((0 until device.interfaceCount).any {
          device.getInterface(it).interfaceClass == UsbConstants.USB_CLASS_VENDOR_SPEC
        }) {
      return "vendor_specific"
    }

    return "unsupported"
  }

  private fun findWritablePath(device: UsbDevice): WritablePath {
    val classification = classify(device)
    if (classification == "usb_serial") {
      throw UsbPrinterException(
          "USB_SERIAL_DRIVER_REQUIRED",
          "This device appears to be USB serial. Its chipset must be identified and configured before printing.",
      )
    }

    val allowedInterfaceClasses =
        when (classification) {
          "printer_class" -> setOf(UsbConstants.USB_CLASS_PRINTER)
          "vendor_specific" -> setOf(UsbConstants.USB_CLASS_VENDOR_SPEC)
          else -> emptySet()
        }

    for (interfaceIndex in 0 until device.interfaceCount) {
      val usbInterface = device.getInterface(interfaceIndex)
      if (usbInterface.interfaceClass !in allowedInterfaceClasses) {
        continue
      }

      for (endpointIndex in 0 until usbInterface.endpointCount) {
        val endpoint = usbInterface.getEndpoint(endpointIndex)
        if (endpoint.direction == UsbConstants.USB_DIR_OUT &&
            endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
          return WritablePath(usbInterface, endpoint, classification)
        }
      }
    }

    throw UsbPrinterException(
        "USB_WRITABLE_ENDPOINT_NOT_FOUND",
        "No supported BULK OUT endpoint was found on the selected USB device.",
    )
  }

  private inline fun <Result> withClaimedPath(
      device: UsbDevice,
      path: WritablePath,
      operation: (UsbDeviceConnection, WritablePath) -> Result,
  ): Result =
      withClaimedUsbResource(
          open = { usbManager.openDevice(device) },
          resource = path,
          claim = { connection, writablePath ->
            connection.claimInterface(writablePath.usbInterface, true)
          },
          operation = operation,
          release = { connection, writablePath ->
            try {
              connection.releaseInterface(writablePath.usbInterface)
            } catch (_: Exception) {
              // Cleanup is best-effort; close is still guaranteed by the outer finally.
            }
          },
          close = { connection ->
            try {
              connection.close()
            } catch (_: Exception) {
              // Nothing remains open after close returns or fails.
            }
          },
      )

  private fun deviceToMap(device: UsbDevice): WritableMap =
      Arguments.createMap().apply {
        putInt("deviceId", device.deviceId)
        putString("deviceName", device.deviceName)
        putInt("vendorId", device.vendorId)
        putInt("productId", device.productId)
        putInt("deviceClass", device.deviceClass)
        putInt("deviceSubclass", device.deviceSubclass)
        putInt("deviceProtocol", device.deviceProtocol)
        putString("manufacturerName", safeDescriptor { device.manufacturerName })
        putString("productName", safeDescriptor { device.productName })
        putString("serialNumber", safeDescriptor { device.serialNumber })
        putString("version", safeDescriptor { device.version })
        putBoolean("hasPermission", usbManager.hasPermission(device))
        putString("classification", classify(device))
        putArray("interfaces", interfacesToArray(device))
      }

  private fun interfacesToArray(device: UsbDevice): WritableArray =
      Arguments.createArray().apply {
        for (interfaceIndex in 0 until device.interfaceCount) {
          val usbInterface = device.getInterface(interfaceIndex)
          pushMap(
              Arguments.createMap().apply {
                putInt("index", interfaceIndex)
                putInt("id", usbInterface.id)
                putInt("alternateSetting", usbInterface.alternateSetting)
                putString("name", safeDescriptor { usbInterface.name })
                putInt("class", usbInterface.interfaceClass)
                putInt("subclass", usbInterface.interfaceSubclass)
                putInt("protocol", usbInterface.interfaceProtocol)
                putArray("endpoints", endpointsToArray(usbInterface))
              }
          )
        }
      }

  private fun endpointsToArray(usbInterface: UsbInterface): WritableArray =
      Arguments.createArray().apply {
        for (endpointIndex in 0 until usbInterface.endpointCount) {
          val endpoint = usbInterface.getEndpoint(endpointIndex)
          pushMap(
              Arguments.createMap().apply {
                putInt("index", endpointIndex)
                putInt("address", endpoint.address)
                putInt("endpointNumber", endpoint.endpointNumber)
                putInt("directionValue", endpoint.direction)
                putString("direction", directionName(endpoint.direction))
                putInt("typeValue", endpoint.type)
                putString("type", endpointTypeName(endpoint.type))
                putInt("maxPacketSize", endpoint.maxPacketSize)
                putInt("interval", endpoint.interval)
              }
          )
        }
      }

  private fun operationResult(
      device: UsbDevice,
      path: WritablePath,
      bytesWritten: Int,
      transferCount: Int,
      message: String,
  ): WritableMap =
      Arguments.createMap().apply {
        putBoolean("success", true)
        putString("message", message)
        putInt("vendorId", device.vendorId)
        putInt("productId", device.productId)
        putString("classification", path.classification)
        putInt("interfaceIndex", findInterfaceIndex(device, path.usbInterface))
        putInt("interfaceId", path.usbInterface.id)
        putInt("interfaceClass", path.usbInterface.interfaceClass)
        putInt("endpointAddress", path.endpoint.address)
        putString("endpointType", endpointTypeName(path.endpoint.type))
        putInt("maxPacketSize", path.endpoint.maxPacketSize)
        putInt("bytesWritten", bytesWritten)
        putInt("transferCount", transferCount)
        putBoolean("cleanedUp", true)
        putInt("logicalWriteAttempts", if (bytesWritten > 0) 1 else 0)
      }

  private fun findInterfaceIndex(device: UsbDevice, target: UsbInterface): Int {
    for (index in 0 until device.interfaceCount) {
      if (device.getInterface(index) == target) {
        return index
      }
    }
    return -1
  }

  private fun registerPermissionReceiver(receiver: BroadcastReceiver, filter: IntentFilter) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactApplicationContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION") reactApplicationContext.registerReceiver(receiver, filter)
    }
  }

  private fun registerUsbEventReceiver() {
    if (eventReceiverRegistered) {
      return
    }

    val filter =
        IntentFilter().apply {
          addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
          addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactApplicationContext.registerReceiver(
          usbEventReceiver,
          filter,
          Context.RECEIVER_EXPORTED,
      )
    } else {
      @Suppress("DEPRECATION") reactApplicationContext.registerReceiver(usbEventReceiver, filter)
    }
    eventReceiverRegistered = true
  }

  private fun unregisterUsbEventReceiver() {
    if (!eventReceiverRegistered) {
      return
    }

    try {
      reactApplicationContext.unregisterReceiver(usbEventReceiver)
    } catch (_: IllegalArgumentException) {
      // Already unregistered during teardown.
    } finally {
      eventReceiverRegistered = false
    }
  }

  private fun emitDeviceEvent(eventName: String, device: WritableMap) {
    if (!reactApplicationContext.hasActiveReactInstance()) {
      return
    }

    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, device)
  }

  private fun unregisterPermissionReceiver(receiver: BroadcastReceiver) {
    try {
      reactApplicationContext.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
      // Already unregistered during teardown.
    }
  }

  private fun Intent.usbDeviceExtra(): UsbDevice? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
      } else {
        @Suppress("DEPRECATION") getParcelableExtra(UsbManager.EXTRA_DEVICE)
      }

  private fun safeDescriptor(getter: () -> String?): String? =
      try {
        getter()
      } catch (_: SecurityException) {
        null
      }

  private fun directionName(direction: Int): String =
      if (direction == UsbConstants.USB_DIR_IN) "IN" else "OUT"

  private fun endpointTypeName(type: Int): String =
      when (type) {
        UsbConstants.USB_ENDPOINT_XFER_CONTROL -> "CONTROL"
        UsbConstants.USB_ENDPOINT_XFER_ISOC -> "ISOCHRONOUS"
        UsbConstants.USB_ENDPOINT_XFER_BULK -> "BULK"
        UsbConstants.USB_ENDPOINT_XFER_INT -> "INTERRUPT"
        else -> "UNKNOWN"
      }

  private fun reject(promise: Promise, error: Exception, fallbackCode: String) {
    if (error is UsbPrinterException) {
      promise.reject(error.errorCode, error.message, error)
    } else {
      promise.reject(fallbackCode, error.message ?: fallbackCode, error)
    }
  }

  companion object {
    const val NAME = "UsbPrinter"
    const val EVENT_DEVICE_ATTACHED = "UsbPrinterDeviceAttached"
    const val EVENT_DEVICE_DETACHED = "UsbPrinterDeviceDetached"
    private const val DEFAULT_WRITE_CHUNK_SIZE = 16 * 1024
    private const val WRITE_TIMEOUT_MS = 5_000
    private val COMMON_SERIAL_VENDOR_IDS =
        setOf(
            0x0403, // FTDI
            0x067B, // Prolific PL2303
            0x10C4, // Silicon Labs CP210x
            0x1A86, // QinHeng CH340/CH341
        )
  }
}
