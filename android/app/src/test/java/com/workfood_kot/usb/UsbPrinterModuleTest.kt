package com.workfood_kot.usb

import android.app.PendingIntent
import android.os.Build
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class UsbPrinterModuleTest {
  private class FakePermissionRequest(var timeoutCancelled: Boolean = false)

  @Test
  fun `claimed resource is released and closed after success`() {
    val events = mutableListOf<String>()

    val result =
        withClaimedUsbResource(
            open = {
              events += "open"
              "connection"
            },
            resource = "interface",
            claim = { _, _ ->
              events += "claim"
              true
            },
            operation = { _, _ ->
              events += "operation"
              "success"
            },
            release = { _, _ -> events += "release" },
            close = { events += "close" },
        )

    assertEquals("success", result)
    assertEquals(listOf("open", "claim", "operation", "release", "close"), events)
  }

  @Test
  fun `connection test cleanup finishes before following print opens`() {
    val events = mutableListOf<String>()

    withClaimedUsbResource(
        open = {
          events += "test-open"
          "test-connection"
        },
        resource = "interface",
        claim = { _, _ ->
          events += "test-claim"
          true
        },
        operation = { _, _ -> events += "test-operation" },
        release = { _, _ -> events += "test-release" },
        close = { events += "test-close" },
    )

    withClaimedUsbResource(
        open = {
          events += "print-open"
          "print-connection"
        },
        resource = "interface",
        claim = { _, _ ->
          events += "print-claim"
          true
        },
        operation = { _, _ -> events += "print-write-once" },
        release = { _, _ -> events += "print-release" },
        close = { events += "print-close" },
    )

    assertEquals(
        listOf(
            "test-open",
            "test-claim",
            "test-operation",
            "test-release",
            "test-close",
            "print-open",
            "print-claim",
            "print-write-once",
            "print-release",
            "print-close",
        ),
        events,
    )
  }

  @Test
  fun `claimed resource is released and closed after operation failure`() {
    val events = mutableListOf<String>()

    try {
      withClaimedUsbResource(
          open = {
            events += "open"
            "connection"
          },
          resource = "interface",
          claim = { _, _ ->
            events += "claim"
            true
          },
          operation = { _, _ ->
            events += "operation"
            throw IllegalStateException("transfer failed")
          },
          release = { _, _ -> events += "release" },
          close = { events += "close" },
      )
    } catch (error: IllegalStateException) {
      assertEquals("transfer failed", error.message)
    }

    assertEquals(listOf("open", "claim", "operation", "release", "close"), events)
  }

  @Test
  fun `claim failure closes without releasing an unclaimed interface`() {
    val events = mutableListOf<String>()

    try {
      withClaimedUsbResource(
          open = {
            events += "open"
            "connection"
          },
          resource = "interface",
          claim = { _, _ ->
            events += "claim"
            false
          },
          operation = { _, _ -> events += "operation" },
          release = { _, _ -> events += "release" },
          close = { events += "close" },
      )
    } catch (error: UsbPrinterException) {
      assertEquals("USB_CLAIM_FAILED", error.errorCode)
    }

    assertEquals(listOf("open", "claim", "close"), events)
  }

  @Test
  fun `chunking advances and never restarts the receipt after partial writes`() {
    val offsets = mutableListOf<Int>()
    val requested = mutableListOf<Int>()

    val transfers =
        writeSequentialChunks(totalBytes = 10, chunkSize = 4) { offset, request ->
          offsets += offset
          requested += request
          if (offset == 0) 2 else request
        }

    assertEquals(listOf(0, 2, 6), offsets)
    assertEquals(listOf(4, 4, 4), requested)
    assertEquals(3, transfers)
  }

  @Test
  fun `multiple full chunks advance sequentially`() {
    val offsets = mutableListOf<Int>()
    val requested = mutableListOf<Int>()

    val transfers =
        writeSequentialChunks(totalBytes = 10, chunkSize = 4) { offset, request ->
          offsets += offset
          requested += request
          request
        }

    assertEquals(listOf(0, 4, 8), offsets)
    assertEquals(listOf(4, 4, 2), requested)
    assertEquals(3, transfers)
  }

  @Test
  fun `zero byte receipt is rejected before transfer`() {
    var transferCalled = false

    try {
      writeSequentialChunks(totalBytes = 0, chunkSize = 64) { _, _ ->
        transferCalled = true
        0
      }
      fail("Expected USB_DATA_EMPTY")
    } catch (error: UsbPrinterException) {
      assertEquals("USB_DATA_EMPTY", error.errorCode)
    }

    assertEquals(false, transferCalled)
  }

  @Test
  fun `invalid chunk size is rejected before transfer`() {
    try {
      writeSequentialChunks(totalBytes = 10, chunkSize = 0) { _, _ -> 0 }
      fail("Expected USB_INVALID_PACKET_SIZE")
    } catch (error: UsbPrinterException) {
      assertEquals("USB_INVALID_PACKET_SIZE", error.errorCode)
    }
  }

  @Test
  fun `failed later chunk does not restart from offset zero`() {
    val offsets = mutableListOf<Int>()

    try {
      writeSequentialChunks(totalBytes = 10, chunkSize = 4) { offset, request ->
        offsets += offset
        if (offset >= 4) -1 else request
      }
    } catch (error: UsbPrinterException) {
      assertEquals("USB_WRITE_FAILED", error.errorCode)
      assertTrue(error.message!!.contains("after 4 of 10 bytes"))
    }

    assertEquals(listOf(0, 4), offsets)
  }

  @Test
  fun `Android 12 permission intent is mutable and never immutable`() {
    val flags = usbPermissionPendingIntentFlags(Build.VERSION_CODES.S)

    assertTrue(flags and PendingIntent.FLAG_UPDATE_CURRENT != 0)
    assertTrue(flags and PendingIntent.FLAG_MUTABLE != 0)
    assertEquals(0, flags and PendingIntent.FLAG_IMMUTABLE)
  }

  @Test
  fun `legacy permission intent keeps update current without mutability flags`() {
    val flags = usbPermissionPendingIntentFlags(Build.VERSION_CODES.R)

    assertTrue(flags and PendingIntent.FLAG_UPDATE_CURRENT != 0)
    assertEquals(0, flags and PendingIntent.FLAG_MUTABLE)
    assertEquals(0, flags and PendingIntent.FLAG_IMMUTABLE)
  }

  @Test
  fun `permission grant accepts intent result or manager fallback when device extra is missing`() {
    assertTrue(
        isUsbPermissionGranted(
            expectedDeviceName = "/dev/bus/usb/001/002",
            receivedDeviceName = null,
            grantedByIntent = true,
            grantedByManager = false,
        )
    )
    assertTrue(
        isUsbPermissionGranted(
            expectedDeviceName = "/dev/bus/usb/001/002",
            receivedDeviceName = null,
            grantedByIntent = false,
            grantedByManager = true,
        )
    )
  }

  @Test
  fun `permission denial and mismatched device never grant access`() {
    assertFalse(
        isUsbPermissionGranted(
            expectedDeviceName = "/dev/bus/usb/001/002",
            receivedDeviceName = null,
            grantedByIntent = false,
            grantedByManager = false,
        )
    )
    assertFalse(
        isUsbPermissionGranted(
            expectedDeviceName = "/dev/bus/usb/001/002",
            receivedDeviceName = "/dev/bus/usb/001/003",
            grantedByIntent = true,
            grantedByManager = true,
        )
    )
  }

  @Test
  fun `concurrent request is rejected until active request completes`() {
    val state =
        SinglePendingUsbPermissionRequest<FakePermissionRequest> { request ->
          request.timeoutCancelled = true
        }
    val first = FakePermissionRequest()
    val second = FakePermissionRequest()

    assertTrue(state.tryStart(first))
    assertFalse(state.tryStart(second))
    assertTrue(state.hasPending())
    assertEquals(first, state.finish(first))
    assertTrue(first.timeoutCancelled)
    assertFalse(state.hasPending())
    assertTrue(state.tryStart(second))
  }

  @Test
  fun `missing permission extras still complete and clear pending state`() {
    val request = FakePermissionRequest()
    val state =
        SinglePendingUsbPermissionRequest<FakePermissionRequest> { active ->
          active.timeoutCancelled = true
        }
    state.tryStart(request)

    val granted =
        isUsbPermissionGranted(
            expectedDeviceName = "/dev/bus/usb/001/002",
            receivedDeviceName = null,
            grantedByIntent = false,
            grantedByManager = false,
        )
    val completed = state.finish(request)

    assertFalse(granted)
    assertEquals(request, completed)
    assertFalse(state.hasPending())
    assertTrue(request.timeoutCancelled)
  }

  @Test
  fun `request failure clears state and permits retry`() {
    val state = SinglePendingUsbPermissionRequest<FakePermissionRequest> { request ->
      request.timeoutCancelled = true
    }
    val failed = FakePermissionRequest()
    val retry = FakePermissionRequest()
    state.tryStart(failed)

    assertEquals(failed, state.finish(failed))
    assertTrue(failed.timeoutCancelled)
    assertTrue(state.tryStart(retry))
  }

  @Test
  fun `module invalidation or timeout cancels and clears active request`() {
    val state = SinglePendingUsbPermissionRequest<FakePermissionRequest> { request ->
      request.timeoutCancelled = true
    }
    val active = FakePermissionRequest()
    state.tryStart(active)

    assertEquals(active, state.cancelPending())
    assertTrue(active.timeoutCancelled)
    assertFalse(state.hasPending())
    assertNull(state.cancelPending())
  }
}
