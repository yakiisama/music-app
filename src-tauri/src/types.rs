use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub id: String,
    pub title: String,
    pub duration_sec: Option<u64>,
    pub thumbnail: Option<String>,
    pub uploader: Option<String>,
}
