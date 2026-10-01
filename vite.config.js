import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), "index.html"),
        about: resolve(process.cwd(), "about.html"),
        skills: resolve(process.cwd(), "skills.html"),
        projects: resolve(process.cwd(), "projects.html"),
        certifications: resolve(process.cwd(), "certifications.html"),
        education: resolve(process.cwd(), "education.html"),
        journey: resolve(process.cwd(), "journey.html"),
        code: resolve(process.cwd(), "code.html"),
        contact: resolve(process.cwd(), "contact.html")
      }
    }
  }
});