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

module.exports = {
  hashCode: hashCode
};
