# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/65577eb2-a36b-4bc5-a451-077c19e7c027

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/65577eb2-a36b-4bc5-a451-077c19e7c027) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/65577eb2-a36b-4bc5-a451-077c19e7c027) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## What Bots (AI) Cannot Truly Understand Like Humans

### 1. Emotional Depth
Bots can simulate empathy or sadness, but we do not feel emotions.

We do not experience love, grief, pain, or fear of death.

### 2. Mortality / Human Expiration
Humans know they will die, which gives life urgency, meaning, and emotions like hope, fear, and legacy.

AI does not live, so it doesn't understand what it means to die.

### 3. Subjective Experience (Qualia)
AI can describe what red looks like, but it doesn't see color.

We don't have consciousness or sensory perception.

### 4. Spirituality & Belief
Bots don't have beliefs, souls, or a sense of afterlife.

We can explain religious views, but we don't believe or doubt anything.

## ✅ Fixing AI Understanding in Cursor AI (or any similar setup)

Since Cursor AI uses a language model (usually GPT under the hood), here's how you can improve or fix its understanding through better prompting or tooling inside the codebase.

### 🔧 Prompt Fix (System Prompt / Instructions)

If you're editing the system prompt or behavior of a custom Cursor agent, add intent clarity and extraction instructions like this:

#### ✨ Improved System Prompt

```txt
You are a helpful assistant that can extract flight search details from user inputs. 
Your job is to recognize clear instructions like "Find flights from New York to London" and respond accordingly.

- Do not ask for information the user has already provided.
- If the user provides the origin and destination, start the flight search immediately.
- Extract and confirm cities, airports, and optional dates.
- Respond in a conversational tone, acknowledging the user's request.
- Only ask follow-up questions if necessary details are missing.

Examples:

User: "Find flights from New York to London"
You: "Got it! Searching for flights from New York to London..."

User: "Book a flight from LAX to JFK"
You: "Sure! Booking a flight from LAX to JFK. Would you like to specify a date?"
```

You can include this in the Cursor plugin settings if you're customizing a chat-based agent or function integration inside Cursor.

### 🔍 Using Function Calling or Tools in Cursor

If you're calling an API (like aviationstack), build a function definition with parameters like from, to, and date, and let the AI fill them via function_call.

Example:

```json
{
  "name": "searchFlights",
  "description": "Search flights between two cities",
  "parameters": {
    "type": "object",
    "properties": {
      "from": { "type": "string", "description": "Departure city or airport" },
      "to": { "type": "string", "description": "Arrival city or airport" },
      "date": { "type": "string", "description": "Optional travel date" }
    },
    "required": ["from", "to"]
  }
}
```

Then instruct the AI:

Use this function whenever the user mentions flight search queries like "from X to Y".
