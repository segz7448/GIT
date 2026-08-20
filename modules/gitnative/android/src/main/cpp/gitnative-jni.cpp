// JNI glue layer: Kotlin (GitNativeModule.kt) <-> Rust core (rust/src/lib.rs).
//
// Kept deliberately thin — all real logic lives in Rust. This file's only
// job is marshalling JVM types (jbyteArray/jstring) to/from the Rust
// extern "C" ABI and freeing what Rust allocated.

#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>

#define LOG_TAG "GitNativeJNI"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

extern "C" {
// Declared in rust/src/lib.rs, linked via libgitnative_core.a
char* gitnative_hash_blob(const uint8_t* data, size_t len);
char* gitnative_diff_lines(const char* a, const char* b);
void gitnative_free_string(char* s);
}

static jstring rustStringToJString(JNIEnv* env, char* rustStr) {
    if (rustStr == nullptr) {
        return env->NewStringUTF("");
    }
    jstring result = env->NewStringUTF(rustStr);
    gitnative_free_string(rustStr);
    return result;
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_gitnative_GitNativeModule_nativeHashBlob(
    JNIEnv* env, jobject /* this */, jbyteArray data) {
    jsize len = env->GetArrayLength(data);
    std::vector<uint8_t> buffer(static_cast<size_t>(len));
    env->GetByteArrayRegion(data, 0, len, reinterpret_cast<jbyte*>(buffer.data()));

    char* hashed = gitnative_hash_blob(buffer.data(), buffer.size());
    return rustStringToJString(env, hashed);
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_gitnative_GitNativeModule_nativeDiffLines(
    JNIEnv* env, jobject /* this */, jstring a, jstring b) {
    const char* aChars = env->GetStringUTFChars(a, nullptr);
    const char* bChars = env->GetStringUTFChars(b, nullptr);

    char* diffJson = gitnative_diff_lines(aChars, bChars);
    jstring result = rustStringToJString(env, diffJson);

    env->ReleaseStringUTFChars(a, aChars);
    env->ReleaseStringUTFChars(b, bChars);
    return result;
}
