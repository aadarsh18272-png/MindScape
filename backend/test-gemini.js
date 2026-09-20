require("dotenv").config();

const https = require("https");

const data = JSON.stringify({
    contents: [
        {
            parts: [
                {
                    text: "Say GEMINI WORKS"
                }
            ]
        }
    ]
});

const options = {
    hostname: "generativelanguage.googleapis.com",
    path: "/v1beta/models/gemini-3.6-flash:generateContent",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Length": Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = "";

    res.on("data", chunk => {
        body += chunk;
    });

    res.on("end", () => {
        console.log("HTTP STATUS:", res.statusCode);
        console.log("RESPONSE:", body);
    });
});

req.on("error", error => {
    console.error("REQUEST ERROR:", error);
});

req.write(data);
req.end();