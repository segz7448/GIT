package expo.modules.gitnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Base64
import android.util.Log

/**
 * TS-facing surface for the native performance core.
 *
 * hashBlob / diffLines call down through JNI (gitnative-jni.cpp) into the
 * Rust core (rust/src/lib.rs). If the native library fails to load on a
 * given device/ABI, [nativeLibAvailable] reports false and callers
 * (src/services/nativeAccel.ts) fall back to the existing pure-JS path —
 * this module is a performance accelerator, never a hard dependency.
 */
class GitNativeModule : Module() {

    private var libLoaded = false

    init {
        libLoaded = try {
            System.loadLibrary("gitnative_jni")
            true
        } catch (e: UnsatisfiedLinkError) {
            Log.w("GitNativeModule", "Native lib unavailable, JS fallback will be used", e)
            false
        }
    }

    override fun definition() = ModuleDefinition {
        Name("GitNative")

        Function("isAvailable") { libLoaded }

        AsyncFunction("hashBlobBase64") { base64Content: String ->
            if (!libLoaded) throw IllegalStateException("gitnative_jni not loaded")
            val bytes = Base64.decode(base64Content, Base64.NO_WRAP)
            nativeHashBlob(bytes)
        }

        AsyncFunction("diffLines") { a: String, b: String ->
            if (!libLoaded) throw IllegalStateException("gitnative_jni not loaded")
            nativeDiffLines(a, b)
        }
    }

    // Implemented in gitnative-jni.cpp
    private external fun nativeHashBlob(data: ByteArray): String
    private external fun nativeDiffLines(a: String, b: String): String
}
