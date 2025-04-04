// Netlify function to serve the Next.js application
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Gurukul LMS</title>
          <meta http-equiv="refresh" content="0;url=/" />
        </head>
        <body>
          <p>Please wait while you're redirected to the application...</p>
        </body>
      </html>
    `,
  };
}; 