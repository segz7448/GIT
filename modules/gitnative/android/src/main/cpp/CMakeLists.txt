cmake_minimum_required(VERSION 3.22)
project(gitnative_jni)

# The Rust core is built separately per-ABI via cargo-ndk (see
# ../../../BUILD_NOTES.md) into rust/target/<abi>/release/libgitnative_core.a
# before this CMake configure step runs (wired up in build.gradle's
# externalNativeBuild task dependency).

set(RUST_LIB_DIR "${CMAKE_SOURCE_DIR}/../../../../rust/target/${ANDROID_ABI}/release")

add_library(gitnative_jni SHARED gitnative-jni.cpp)

find_library(log-lib log)

add_library(gitnative_core STATIC IMPORTED)
set_target_properties(gitnative_core PROPERTIES
  IMPORTED_LOCATION "${RUST_LIB_DIR}/libgitnative_core.a"
)

target_link_libraries(gitnative_jni
  gitnative_core
  ${log-lib}
)

target_compile_options(gitnative_jni PRIVATE -std=c++17 -Wall -Wextra -O3)
