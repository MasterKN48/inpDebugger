// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent};

fn main() {
    let server_child: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let server_child_clone = Arc::clone(&server_child);

    tauri::Builder::default()
        .setup(move |app| {
            // Determine path to server index.js
            let resource_path = app.path().resource_dir()
                .map(|p| p.join("apps").join("server").join("index.js"))
                .unwrap_or_else(|_| std::path::PathBuf::from("apps/server/index.js"));

            // Check if resource exists, otherwise fall back to local dev path
            let final_path = if resource_path.exists() {
                resource_path
            } else {
                std::path::PathBuf::from("apps/server/index.js")
            };

            println!("🚀 Spawning Elysia API server from: {:?}", final_path);

            // Spawn Bun process running the server
            let child = Command::new("bun")
                .arg(final_path)
                .spawn();

            match child {
                Ok(c) => {
                    let mut server_guard = server_child_clone.lock().unwrap();
                    *server_guard = Some(c);
                    println!("❇️ Elysia API server spawned successfully.");
                }
                Err(err) => {
                    eprintln!("❌ Failed to spawn Elysia API server via bun: {:?}", err);
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            if let RunEvent::Exit = event {
                // Kill the server child process when Tauri app exits
                let mut server_guard = server_child.lock().unwrap();
                if let Some(mut child) = server_guard.take() {
                    println!("🛑 Stopping Elysia API server background process...");
                    let _ = child.kill();
                }
            }
        });
}
