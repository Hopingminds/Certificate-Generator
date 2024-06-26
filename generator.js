const express = require('express')
const app = express();
const mongoose = require('mongoose')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const cors = require('cors')
app.use(express.urlencoded({extended:true}))
app.use(cors())
const fs = require('fs').promises;
const fontkit = require('@pdf-lib/fontkit');
const { Readable } = require('stream');


const generatePDF = async (name, selectedCourse, selectedDate, selectedCertficateTemplate) => {
    const certificate1 = await fs.readFile('./cert.pdf');
    const certificate2 = await fs.readFile('./cert2.pdf');
    const certificate3 = await fs.readFile('./cert3.pdf');
    const certificate4 = await fs.readFile('./cert4.pdf');
    const certificate5 = await fs.readFile('./cert5.pdf');
    let pdfDoc = await PDFDocument.load(certificate1);
    // Load a PDFDocument from the existing PDF bytes

    switch (selectedCertficateTemplate) {
      case 1:
        pdfDoc = await PDFDocument.load(certificate1);
        break;
      case 2:
        pdfDoc = await PDFDocument.load(certificate2);
        break
      case 3:
        pdfDoc = await PDFDocument.load(certificate3);
        break
    case 4:
        pdfDoc = await PDFDocument.load(certificate4);
        break
    case 5:
        pdfDoc = await PDFDocument.load(certificate5);
        break
      default:
        break;
    }
  
    // Register the standard fonts with the PDFDocument
    pdfDoc.registerFontkit(fontkit);
  
    // Get the standard font Helvetica
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    //get custom font
    const fontBytes = await fs.readFile('./GoodVibrations Script.ttf');
    const montFont = await fs.readFile('./Montserrat-Medium.ttf');
    const dateBytes = await fs.readFile('./Sanchez-Regular.ttf');
  
    // Embed our custom font in the document
    const customFont = await pdfDoc.embedFont(fontBytes);
    const customMontFont = await pdfDoc.embedFont(montFont);
    const dateFont = await pdfDoc.embedFont(dateBytes);
    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const fontSize = 58;
    const textWidth = customFont.widthOfTextAtSize(name, fontSize);
  
    // Get the width and height of the first page
    const { width, height } = firstPage.getSize();
  
    // Calculate the x and y positions to center align the text
    const xPosition = (width - textWidth) / 2;
    const yPosition = height / 4 + 90;
  
    // Draw the text in the center
    firstPage.drawText(name, {
      x: xPosition,
      y: yPosition + 50,
      size: fontSize,
      font: customFont,
      color: rgb(0.2, 0.84, 0.67),
    });
  
    // Manually position the course and date below the name
    const courseFontSize = 20;
    const dateFontSize = 16;
    const courseTextWidth = customMontFont.widthOfTextAtSize(selectedCourse, courseFontSize);
    const courseXPosition = (width - courseTextWidth) / 2;
    const courseYPosition = 218;
    const dateXPosition = 160; // Adjust the x position as needed
    const dateYPosition = 145;
  
    firstPage.drawText(`${selectedCourse}`, {
      x: courseXPosition,
      y: courseYPosition,
      size: courseFontSize,
      font: customMontFont,
      color: rgb(0, 0, 0),
    });
  
    firstPage.drawText(`${selectedDate}`, {
      x: dateXPosition,
      y: dateYPosition,
      size: dateFontSize,
      font: dateFont,
      color: rgb(0, 0, 0),
    });
  
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();
    return pdfBytes
    // console.log("Done creating");
  
    // // Create a Blob and trigger download
    // const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    // const pdfUrl = URL.createObjectURL(pdfBlob);
    // const link = document.createElement("a");
    // link.href = pdfUrl;
    // link.download = "Certificate.pdf";
    // link.click();
  };

  const dataSchema = new mongoose.Schema({
    name: String,
    email: String,
    course: String,
  });

  const Data = mongoose.model('Data', dataSchema);



  app.post('/auth', async (req, res) => {
    const { name, email, selectedCourse, selectedDate, selectedCertficateTemplate } = req.body;
  
    console.log(name, email, selectedCourse, selectedDate);
    if (!name || !email || !selectedCourse || !selectedDate) {
      return res.send("Please fill all the details");
    }

    const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );
  
    const capitalized_name = capitalize(name.trim());
    const trimmed_email = email.trim();
    const trimmed_selectedCourse = selectedCourse.trim();
  
    try {
      const userFound = await Data.findOne({
        $and: [
          { email: { $regex: new RegExp("^" + email + "$", "i") } },
          { name: { $regex: new RegExp("^" + name + "$", "i") } },
          { course: trimmed_selectedCourse }
        ]
      });      

        if(userFound){
            const pdfBytes = await generatePDF(capitalized_name, trimmed_selectedCourse, selectedDate, Number(selectedCertficateTemplate));
  
            // Convert Uint8Array to Buffer
            const pdfBuffer = Buffer.from(pdfBytes);
        
            // Set the response headers to trigger the download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=hopingminds_${capitalized_name}.pdf`);
        
            // Send the PDF Buffer as the response
            res.send(pdfBuffer);
        }

        else {
          const alertScript = `
              <script>
                  alert("User not found. Please provide valid information.");
                  window.history.back();
              </script>
          `;
          res.send(alertScript);
      }
      
      
      
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating certificate");
    }
  });
  

mongoose.connect('mongodb+srv://anuraag:discovery1@cluster0.9thc6oj.mongodb.net/certify?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    console.log("connected")
}).catch((err) => {
    console.log("disconnected", err)
})

app.listen(7009, () => {

    console.log("running")
})

