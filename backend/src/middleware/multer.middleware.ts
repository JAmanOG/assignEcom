import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB
    },
    
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.split('.').pop()?.toLowerCase() || '');

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("File type not supported"));
        }
    }
})