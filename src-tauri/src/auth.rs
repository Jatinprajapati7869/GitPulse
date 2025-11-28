use keyring::Entry;

pub fn save_token(service: &str, user: &str, token: &str) -> Result<(), String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.set_password(token).map_err(|e| e.to_string())
}

pub fn get_token(service: &str, user: &str) -> Result<String, String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

pub fn delete_token(service: &str, user: &str) -> Result<(), String> {
    let entry = Entry::new(service, user).map_err(|e| e.to_string())?;
    entry.delete_password().map_err(|e| e.to_string())
}
