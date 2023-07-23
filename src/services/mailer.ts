import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

interface MessageInterface {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}

export const mailer = async (data: MessageInterface) => {
  if (process.env.NODE_ENV === "development") {
    return new Promise((resolve) => resolve(""));
  }
  sgMail.send(data).catch(() => {
    console.log("Error while sending Eail", JSON.stringify(data));
  });
};
