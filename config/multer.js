import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimetypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (allowedMimetypes.includes(file.mimetype)) {
            return cb(null, true);
        } else {
            cb(new Error("Error: Only PDFs and DOCX files are allowed!"), false);
        }
    }
});

export default upload;