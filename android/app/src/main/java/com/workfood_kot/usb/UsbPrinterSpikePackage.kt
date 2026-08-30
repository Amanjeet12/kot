package com.workfood_kot.usb

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class UsbPrinterSpikePackage : BaseReactPackage() {
  override fun getModule(
      name: String,
      reactContext: ReactApplicationContext,
  ): NativeModule? =
      if (name == UsbPrinterSpikeModule.NAME) {
        UsbPrinterSpikeModule(reactContext)
      } else {
        null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        UsbPrinterSpikeModule.NAME to
            ReactModuleInfo(
                name = UsbPrinterSpikeModule.NAME,
                className = UsbPrinterSpikeModule::class.java.name,
                canOverrideExistingModule = false,
                needsEagerInit = false,
                isCxxModule = false,
                isTurboModule = false,
            )
    )
  }
}
