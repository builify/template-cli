function hashCode (text) {
  let hash = 0, chr;

  if (text.length === 0) {
    return hash;
  }

  for (let i = 0, len = text.length; i < len; i++) {
    chr   = text.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}

function formatBytes (bytes) {
  if(bytes < 1024) return bytes + " Bytes";
  else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KB";
  else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MB";
  else return(bytes / 1073741824).toFixed(3) + " GB";
}


module.exports = {
  hashCode: hashCode,
  formatBytes: formatBytes
};

