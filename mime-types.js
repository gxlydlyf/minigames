let mime;
let fileTypeFromBuffer;
const lookup = require('mime-types').lookup;

module.exports = async (buffer, path) => {
    if (fileTypeFromBuffer === undefined) {
        fileTypeFromBuffer = (await import("file-type")).fileTypeFromBuffer;
    }
    if (mime === undefined) {
        mime = (await import("mime")).default;
    }
    let fileType;
    if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
        fileType = (await fileTypeFromBuffer(buffer))?.mime;
    }
    return fileType || mime.getType(path) || lookup(path) || 'application/octet-stream';
};