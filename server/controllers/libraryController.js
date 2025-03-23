const Library = require('../models/Library');
const s3 = require('../config/s3Config');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdf-lib').PDFDocument;
const sharp = require('sharp');

async function extractFirstPageAsImage(pdfBuffer) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Get the first page
    const page = pdfDoc.getPages()[0];
    
    // Get page dimensions
    const { width, height } = page.getSize();
    
    // Create a new PDF with just the first page
    const singlePagePdfDoc = await PDFDocument.create();
    const [copiedPage] = await singlePagePdfDoc.copyPages(pdfDoc, [0]);
    singlePagePdfDoc.addPage(copiedPage);
    
    // Save the single page PDF
    const singlePagePdfBytes = await singlePagePdfDoc.save();
    
    // Convert PDF to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(singlePagePdfBytes))
      .resize(800, 1200, { fit: 'inside' })
      .png()
      .toBuffer();
    
    return pngBuffer;
  } catch (error) {
    console.error('Error extracting PDF cover:', error);
    return null;
  }
}

exports.uploadBook = async (req, res) => {
  try {
    const { title, description, authorName, subject, authorTags } = req.body;
    const teacherId = req.user.id;
    
    // Get teacher name from request
    const teacherName = req.body.teacherName || req.user.name || 'Unknown Teacher';
    
    let fileUrl, coverImageUrl, pdfKey, coverImageKey;
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      ACL: 'public-read'
    };

    // Upload PDF
    if (req.files && req.files.file && req.files.file[0]) {
      const pdfBuffer = req.files.file[0].buffer;
      pdfKey = `library/pdf/${uuidv4()}-${req.files.file[0].originalname}`;
      
      // Upload PDF file
      const pdfUpload = await s3.upload({
        ...s3Params,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline'
      }).promise();
      fileUrl = pdfUpload.Location;

      // Handle cover image
      if (req.files.coverImage && req.files.coverImage[0]) {
        // Use provided cover image
        coverImageKey = `library/covers/${uuidv4()}-${req.files.coverImage[0].originalname}`;
        const imageUpload = await s3.upload({
          ...s3Params,
          Key: coverImageKey,
          Body: req.files.coverImage[0].buffer,
          ContentType: req.files.coverImage[0].mimetype,
          ContentDisposition: 'inline'
        }).promise();
        coverImageUrl = imageUpload.Location;
      } else {
        // Extract and use PDF first page as cover
        const pdfCoverBuffer = await extractFirstPageAsImage(pdfBuffer);
        if (pdfCoverBuffer) {
          coverImageKey = `library/covers/${uuidv4()}-cover.png`;
          const pdfCoverUpload = await s3.upload({
            ...s3Params,
            Key: coverImageKey,
            Body: pdfCoverBuffer,
            ContentType: 'image/png',
            ContentDisposition: 'inline'
          }).promise();
          coverImageUrl = pdfCoverUpload.Location;
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    // Create library entry with teacher name
    const book = await Library.create({
      title,
      description,
      authorName,
      subject,
      authorTags: JSON.parse(authorTags || '[]'),
      coverImageUrl,
      fileUrl,
      teacher: teacherId,
      teacherName, // Add teacher name
      s3Keys: {
        coverImage: coverImageKey || null,
        pdf: pdfKey
      }
    });

    // Return the complete book object including URLs
    res.status(201).json({
      success: true,
      data: {
        ...book.toObject(),
        coverImageUrl,
        fileUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading book',
      error: error.message
    });
  }
};

// Add new method to get signed URL for book access
exports.getBookAccessUrl = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const book = await Library.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Generate a signed URL that expires in 1 hour
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: book.s3Keys.pdf,
      Expires: 3600, // URL expires in 1 hour
      ResponseContentDisposition: 'inline', // Opens in browser
      ResponseContentType: 'application/pdf'
    });

    res.status(200).json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('Error generating access URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating book access URL'
    });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const books = await Library.find({ teacher: teacherId }).sort({ createdAt: -1 });
    
    // Make sure URLs are accessible
    const booksWithUrls = books.map(book => ({
      ...book.toObject(),
      coverImageUrl: book.coverImageUrl,
      fileUrl: book.fileUrl
    }));

    res.status(200).json({
      success: true,
      data: booksWithUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching books'
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Library.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Delete files from S3
    if (book.s3Keys.pdf) {
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: book.s3Keys.pdf
      }).promise();
    }

    if (book.s3Keys.coverImage) {
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: book.s3Keys.coverImage
      }).promise();
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting book'
    });
  }
};
