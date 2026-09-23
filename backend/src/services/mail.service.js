// import dotenv from 'dotenv';
// dotenv.config();
// import nodemailer from 'nodemailer';
// import dns from 'dns';
// dns.setDefaultResultOrder('ipv4first');



// // ye nodemailwer se ho raha hai but ipv6 hai isme 


// // const transporter = nodemailer.createTransport({
// // service: 'gmail',
// //   auth: {
// //     type: 'OAuth2',
// //     user: process.env.GOOGLE_USER,
// //     clientId: process.env.GOOGLE_CLIENT_ID,
// //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
// //     refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
// //   },
// // });


// // ye nodemialer se ho raha hai smtp server se google client google id google user and refrehtoken se ho raha hai 4 chize .env mai 

// // const transporter = nodemailer.createTransport({
// //   host: 'smtp.gmail.com',
// //   port: 465,
// //   secure: true,
// //   family: 4, 
// //   auth: {
// //     type: 'OAuth2',
// //     user: process.env.GOOGLE_USER,
// //     clientId: process.env.GOOGLE_CLIENT_ID,
// //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
// //     refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
// //   },
// // });



// // ye ho raha hia google app password page se isme env mai google use and bas google password hai 16 character ka 
//  const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.GOOGLE_USER,
//         pass: process.env.GOOGLE_APP_PASSWORD,
//     },
// });
// transporter.verify()
//     .then(() => {
//         console.log("Ready for sending emails");
//     })
//     .catch((err) => {
//         console.log("Email transporter verification failed");
//         console.log(err);
//     });
//   export async function sendEmail({ to, subject, html,text }){ 
//     const mailOptions = {
//         from: process.env.GOOGLE_USER,
//         to,
//         subject,
//         html,
//         text
//     }
//   const details = await transporter.sendMail(mailOptions);
//   console.log("Email sent successfully");
//   }

import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
    const { data, error } = await resend.emails.send({
        from: "Preplexity <no-reply@pre-edu.in>",
        to: [to],
        subject,
        html,
        text: text || "",
    });

    if (error) {
        console.error("Email sending failed:", error);
        throw new Error(error.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return data;
}