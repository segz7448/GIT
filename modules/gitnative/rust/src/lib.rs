//! GitManager native performance core.
//!
//! Two operations that are measurably slow in pure JS on larger repos and
//! are pulled out here:
//!
//!  1. `hash_blob`      — git-style "blob <len>\0<content>" SHA-1 content
//!                        hash, used by the local file-backup/history layer
//!                        (`src/db/fileBackups.js`) to dedupe snapshots
//!                        without storing duplicate content.
//!  2. `diff_line_hunks` — a Myers-lite line diff that returns changed line
//!                        ranges, used to accelerate the file-history diff
//!                        view for large files where the pure-JS `diff`
//!                        package noticeably drops frames.
//!
//! Exposed via a small `extern "C"` FFI surface, called from the C++ JNI
//! glue in `android/src/main/cpp/gitnative-jni.cpp`.

use sha2::{Digest, Sha256};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

/// SHA-256 content hash (hex string). The caller (C++/Kotlin) frees the
/// returned pointer via `gitnative_free_string`.
#[no_mangle]
pub extern "C" fn gitnative_hash_blob(data: *const u8, len: usize) -> *mut c_char {
    if data.is_null() {
        return CString::new("").unwrap().into_raw();
    }
    let slice = unsafe { std::slice::from_raw_parts(data, len) };
    let mut hasher = Sha256::new();
    hasher.update(format!("blob {}\0", len).as_bytes());
    hasher.update(slice);
    let digest = hasher.finalize();
    let hex: String = digest.iter().map(|b| format!("{:02x}", b)).collect();
    CString::new(hex).unwrap_or_else(|_| CString::new("").unwrap()).into_raw()
}

/// Simple LCS-based line diff. Returns a JSON string of changed hunks:
/// `[{"aStart":n,"aLen":n,"bStart":n,"bLen":n}, ...]`
#[no_mangle]
pub extern "C" fn gitnative_diff_lines(a: *const c_char, b: *const c_char) -> *mut c_char {
    let a_str = unsafe { CStr::from_ptr(a) }.to_string_lossy();
    let b_str = unsafe { CStr::from_ptr(b) }.to_string_lossy();
    let a_lines: Vec<&str> = a_str.lines().collect();
    let b_lines: Vec<&str> = b_str.lines().collect();
    let hunks = diff_hunks(&a_lines, &b_lines);
    let json = hunks_to_json(&hunks);
    CString::new(json).unwrap_or_else(|_| CString::new("[]").unwrap()).into_raw()
}

#[no_mangle]
pub extern "C" fn gitnative_free_string(s: *mut c_char) {
    if s.is_null() {
        return;
    }
    unsafe {
        drop(CString::from_raw(s));
    }
}

struct Hunk {
    a_start: usize,
    a_len: usize,
    b_start: usize,
    b_len: usize,
}

/// LCS dynamic-programming table -> backtrack into contiguous change hunks.
/// O(n*m); fine for the file sizes this app edits (source files, not
/// multi-MB blobs — those stay on the JS fallback path).
fn diff_hunks(a: &[&str], b: &[&str]) -> Vec<Hunk> {
    let n = a.len();
    let m = b.len();
    let mut dp = vec![vec![0u32; m + 1]; n + 1];
    for i in (0..n).rev() {
        for j in (0..m).rev() {
            dp[i][j] = if a[i] == b[j] {
                dp[i + 1][j + 1] + 1
            } else {
                dp[i + 1][j].max(dp[i][j + 1])
            };
        }
    }

    let mut hunks = Vec::new();
    let (mut i, mut j) = (0usize, 0usize);
    let mut pending: Option<Hunk> = None;
    while i < n && j < m {
        if a[i] == b[j] {
            if let Some(h) = pending.take() {
                hunks.push(h);
            }
            i += 1;
            j += 1;
        } else if dp[i + 1][j] >= dp[i][j + 1] {
            grow(&mut pending, i, j, true);
            i += 1;
        } else {
            grow(&mut pending, i, j, false);
            j += 1;
        }
    }
    if i < n {
        grow(&mut pending, i, j, true);
    }
    if j < m {
        grow(&mut pending, i, j, false);
    }
    if let Some(h) = pending.take() {
        hunks.push(h);
    }
    hunks
}

fn grow(pending: &mut Option<Hunk>, i: usize, j: usize, from_a: bool) {
    match pending {
        Some(h) => {
            if from_a {
                h.a_len += 1;
            } else {
                h.b_len += 1;
            }
        }
        None => {
            *pending = Some(Hunk {
                a_start: i,
                a_len: if from_a { 1 } else { 0 },
                b_start: j,
                b_len: if from_a { 0 } else { 1 },
            });
        }
    }
}

fn hunks_to_json(hunks: &[Hunk]) -> String {
    let parts: Vec<String> = hunks
        .iter()
        .map(|h| {
            format!(
                "{{\"aStart\":{},\"aLen\":{},\"bStart\":{},\"bLen\":{}}}",
                h.a_start, h.a_len, h.b_start, h.b_len
            )
        })
        .collect();
    format!("[{}]", parts.join(","))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_lines_produce_no_hunks() {
        let a = vec!["one", "two", "three"];
        let b = vec!["one", "two", "three"];
        assert!(diff_hunks(&a, &b).is_empty());
    }

    #[test]
    fn single_line_change_produces_one_hunk() {
        let a = vec!["one", "two", "three"];
        let b = vec!["one", "TWO", "three"];
        let hunks = diff_hunks(&a, &b);
        assert_eq!(hunks.len(), 1);
        assert_eq!(hunks[0].a_start, 1);
        assert_eq!(hunks[0].b_start, 1);
    }
}
