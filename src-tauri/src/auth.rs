use keyring::Entry;

/// Stores a token in the system keyring for the given service and user.
///
/// Returns `Ok(())` on success, or `Err(String)` with an error message if the operation fails.
///
/// # Examples
///
/// ```
/// let service = "my_app";
/// let user = "alice";
/// let token = "s3cr3t";
/// save_token(service, user, token).expect("failed to save token");
/// ```
pub fn save_token(service: &str, user: &str, token: &str) -> Result<(), String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.set_password(token).map_err(|e| e.to_string())
}

/// Retrieves the stored token (password) for the given service and user from the system keyring.
///
/// # Returns
///
/// `Ok(token)` containing the stored token on success, `Err(message)` with a stringified error otherwise.
///
/// # Examples
///
/// ```no_run
/// let token = get_token("my_service", "alice")?;
/// println!("retrieved token: {}", token);
/// # Ok::<(), String>(())
/// ```
pub fn get_token(service: &str, user: &str) -> Result<String, String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

/// Deletes the stored token for the given service and user from the system keyring.
///
/// `service` is the keyring service name and `user` is the account identifier whose token will be removed.
///
/// # Returns
///
/// `Ok(())` if the token was successfully deleted, `Err(String)` with an error message otherwise.
///
/// # Examples
///
/// ```
/// let result = delete_token("my_app_service", "alice");
/// assert!(result.is_ok());
/// ```
pub fn delete_token(service: &str, user: &str) -> Result<(), String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.delete_password().map_err(|e| e.to_string())
}