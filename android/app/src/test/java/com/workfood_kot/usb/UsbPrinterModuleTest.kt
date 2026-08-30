package com.workfood_kot.usb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class UsbPrinterModuleTest {
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
}
