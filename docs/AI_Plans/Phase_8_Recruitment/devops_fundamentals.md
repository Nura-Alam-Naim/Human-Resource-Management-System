# 🚀 Fundamentals of Docker and CI/CD (Beginner's Guide)

Since you are adding Docker and CI/CD to your Leave Management Portal to impress recruiters for an internship, you need to be prepared to answer basic interview questions about them. 

You don't need to be an expert! You just need to understand *what* these tools are, *why* we use them, and the *basic vocabulary*.

---

## Part 1: Docker Fundamentals

### What is Docker?
Imagine you write an app that works perfectly on your Mac. You send it to a friend who has a Windows PC, and it crashes because they have a different version of Node.js or they don't have MySQL installed.
**Docker solves the "It works on my machine!" problem.** 
It packages your application and everything it needs to run (Node.js, libraries, even the operating system environment) into a standardized box called a **Container**.

### Key Concepts You Must Know:

1. **Image (`Dockerfile`)**
   - Think of an Image as a blueprint or a recipe. 
   - A `Dockerfile` is a text document that contains all the commands to assemble this image (e.g., "Start with Ubuntu, install Node.js, copy my code, run `npm install`").
   - Images are read-only.

2. **Container**
   - A Container is a running, living instance of an Image. 
   - If an Image is a recipe for a cake, the Container is the baked cake that you can actually eat (or in this case, interact with).
   - Containers are isolated from each other and from your main computer (the "Host").

3. **Docker Compose (`docker-compose.yml`)**
   - Your project has three pieces: a Frontend (React), a Backend (Node.js), and a Database (MySQL).
   - Instead of starting three separate containers manually, `docker-compose` lets you define all three services in one YAML file. 
   - You can spin up the entire architecture with one command: `docker-compose up`.

### 💡 Interview Talking Point:
*"I used Docker to containerize my React frontend, Node.js backend, and MySQL database. I used Docker Compose to orchestrate the multi-container setup, ensuring that any developer can spin up the entire application environment with a single command without worrying about local dependencies."*

---

## Part 2: CI/CD Fundamentals (GitHub Actions)

### What is CI/CD?
- **CI (Continuous Integration):** The practice of automating the integration of code changes. When you push code to GitHub, a script automatically runs to ensure your new code hasn't broken anything (usually by running automated tests).
- **CD (Continuous Deployment/Delivery):** Automatically taking that tested code and deploying it to a live server where users can access it. (For this project, we are only focusing on the **CI** part).

### Key Concepts You Must Know:

1. **Pipeline / Workflow (`.github/workflows/ci.yml`)**
   - A pipeline is a set of automated steps. In GitHub Actions, it's defined by a YAML file in a specific `.github` folder.

2. **Trigger (The "When")**
   - The event that starts the pipeline. For this project, the trigger is usually "When someone pushes code to the `main` branch."

3. **Runner (The "Where")**
   - When the pipeline triggers, where does the code run? GitHub provides temporary, virtual machines (called Runners) in the cloud that boot up, run your tests, and then destroy themselves.

4. **Steps (The "What")**
   - The individual commands the Runner executes. For your backend, the steps would be:
     1. Checkout the code from GitHub.
     2. Install Node.js on the runner.
     3. Run `npm install`.
     4. Run `npm test`.

### 💡 Interview Talking Point:
*"I implemented a Continuous Integration pipeline using GitHub Actions. Whenever code is pushed to the repository, the pipeline automatically spins up an isolated runner, installs dependencies, and executes my Jest test suite to catch regressions early and maintain code quality."*

---

## Next Steps for the Project
If you are ready to proceed with adding these features to your project, simply click **Proceed** on the `implementation_plan` artifact I created earlier!
