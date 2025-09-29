import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`[AUTH] Login attempt for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[AUTH] User not found: ${username}`);
        return done(null, false);
      }
      console.log(`[AUTH] User found: ${user.username}, checking password...`);
      const passwordMatch = await comparePasswords(password, user.password);
      console.log(`[AUTH] Password match result: ${passwordMatch}`);
      if (!passwordMatch) {
        console.log(`[AUTH] Password verification failed for: ${username}`);
        return done(null, false);
      } else {
        console.log(`[AUTH] Login successful for: ${username}`);
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
