import { Router, Request, Response } from "express";
import { sendEmailViaGmail } from "../email-service";
import { storage } from "../storage";
import { insertNewsletterSubscriberSchema } from "@shared/schema";

const router = Router();

router.post("/subscribe", async (req: Request, res: Response) => {
  const parseResult = insertNewsletterSubscriberSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid subscriber data",
      errors: parseResult.error.issues,
    });
  }

  const { email, name } = parseResult.data;

  try {
    const existing = await storage.getNewsletterSubscriberByEmail(email);

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already subscribed" });
    }

    await storage.createNewsletterSubscriber({ email, name });

    await sendEmailViaGmail({
      email,
      name,
      message: "Thanks for subscribing!",
      submittedAt: new Date(),
    });

    return res
      .status(201)
      .json({ success: true, message: "Subscribed successfully!" });
  } catch (err) {
    console.error(
      "Subscription error:",
      err instanceof Error ? err.message : err,
    );
    return res
      .status(500)
      .json({ success: false, message: "Failed to subscribe" });
  }
});

export default router;
