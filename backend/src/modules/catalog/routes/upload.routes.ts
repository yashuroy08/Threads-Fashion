import { Router } from 'express';
import { upload } from '../../../common/middleware/upload.middleware';

const router = Router();

router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Return the reachable URL
        // Assumes 'uploads' is served statically from root
        const fileUrl = `/uploads/images/${req.file.filename}`;

        res.status(200).json({
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'File upload failed' });
    }
});

export default router;
