const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({
    dest: uploadDir,
});

const skillsDatabase = [
    "python",
    "java",
    "javascript",
    "react",
    "node",
    "express",
    "html",
    "css",
    "mysql",
    "sqlite",
    "mongodb",
    "docker",
    "kubernetes",
    "aws",
    "git",
    "github",
    "flask",
    "machine learning",
    "artificial intelligence",
    "data analysis",
    "numpy",
    "pandas"
];

app.get("/", (req, res) => {
    res.json({
        message: "ResumeIQ Backend Running"
    });
});

app.post("/analyze", upload.single("resume"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded"
            });
        }

        let resumeText = "";

        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === ".pdf") {

            const buffer = fs.readFileSync(req.file.path);

            const data = await pdf(buffer);

            resumeText = data.text;

        }

        else if (ext === ".docx") {

            const result = await mammoth.extractRawText({
                path: req.file.path
            });

            resumeText = result.value;

        }

        else {

            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                error: "Only PDF and DOCX files are supported."
            });

        }

        resumeText = resumeText.toLowerCase();

        const foundSkills = [];

        skillsDatabase.forEach(skill => {

            if (resumeText.includes(skill)) {

                foundSkills.push(skill);

            }

        });

        const missingSkills = skillsDatabase.filter(
            skill => !foundSkills.includes(skill)
        );

        const atsScore = Math.min(
            95,
            40 + foundSkills.length * 3
        );

        const suggestions = [];

        if (!resumeText.includes("github"))
            suggestions.push("Add your GitHub profile.");

        if (!resumeText.includes("linkedin"))
            suggestions.push("Add your LinkedIn profile.");

        if (!resumeText.includes("project"))
            suggestions.push("Mention more technical projects.");

        if (!resumeText.includes("intern"))
            suggestions.push("Include internship experience.");

        fs.unlinkSync(req.file.path);

        res.json({

            success: true,

            atsScore,

            skillsFound: foundSkills,

            missingSkills,

            suggestions

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});

app.listen(5000, () => {

    console.log("Backend running on port 5000");

});