export const supportedFormats = {
  video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
  image: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'heic', 'webp'],
  audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'],
}

export const allSupportedFormats = [
  ...supportedFormats.audio,
  ...supportedFormats.video,
  ...supportedFormats.image,
]
