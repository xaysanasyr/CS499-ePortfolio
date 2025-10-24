# CS499 ePortfolio – Pet Check-In

## What this is
Simple pet check-in system enhanced across milestones to show Software Engineering & Design, Algorithms & Data Structures, and Databases.

## How to run on Windows 
1. Install Node (LTS) and MongoDB.
2. Copy `.env.example` to `.env` and fill values.
3. `npm install`
4. Web: `npm run start`  |  CLI: `npm run start:cli`

# Introduction
The three artifacts in my ePortfolio come from the same project line, so they tell one story:

Software Engineering and Design: I refactored the original console idea into clear models with consistent naming and responsibilities.

Algorithms and Data Structures: I added queues, stacks, hash maps, and binary search to improve fairness, speed, and control.

Databases: I connected to MongoDB, enforced schema rules, added light indexing, and used an atomic capacity update to prevent double booking.

Together, these artifacts show that I can move a simple idea into a maintainable, testable, and safer system. They set the stage for the rest of the portfolio by demonstrating the range of my skills, from design and algorithms to persistence and security. The sections that follow present the technical artifacts with short explanations of the problem, the approach, and what I learned.


This self-assessment shows how my coursework and ePortfolio strengthened my skills, clarified my values, and made me more employable in computer science. I first planned a web app version of PetCheckIn but chose a command line interface to focus on core logic, data structures, and database rules within the course timeline. It gives a quick overview of my abilities with clear examples from school and work.
I collaborate by keeping work small, visible, and easy to hand off. I use Git branches, clear commits, and short status updates. For PetCheckIn, I split work into models, routes, and tests so tasks could move in parallel. My communication is short and focused on decisions: what changed, why, and what is next. In milestones and journals, I listed status, risks, and next steps in plain language. At work, I do the same for inspection readiness, downtime, and recovery plans, using simple visuals and avoiding jargon.

I apply practical data structures: hash maps for fast lookups, queues for fair order, stacks for undo, and binary search for speed. In PetCheckIn, a queue manages check-ins and a stack allows quick rollback. I think about time and memory costs and choose what fits the goal. I moved from a single file console sketch to a cleaner design with clear schemas (Customer, Pet, Booking, Inventory). I push rules into the data layer, add small indexes, and use atomic updates to prevent double booking. This keeps controllers thin and testing simple.

Security is built in from the start. I use environment variables for secrets, least privilege for data, input validation, and logging that matters. I plan for race conditions and misuse, and I am adding basic threat modeling and hardening.

###### Outcome 1: 
I build collaborative environments by keeping work small, visible, and easy to hand off. I use Git branches for features, write clear commit messages, and share short status updates. For my PetCheckIn work, I split tasks by models (Customer, Pet, Booking, Inventory), routes, and tests so work could run in parallel. At Pratt & Whitney, I use the same style in operations: short stand-ups, a simple board for priorities, and clear owners. These habits support fast decisions across different audiences, including engineers, operators, and managers.

###### Outcome 2: 
I communicate in a way that is clear and useful to the audience. For stakeholders, I focus on what changed, why it changed, and what happens next. In class milestones and journals, I used short sections for status, risk, and next steps. For technical readers, I provide code comments, API notes, and concise diagrams. For non-technical readers, I avoid jargon and tie points to cost, schedule, quality, or safety. I also prepare short walkthroughs (slides or a code review video) that show one end to end flow (input, validation, database write, and result). This mix of oral, written, and visual communication helps different audiences decide faster.

###### Outcome 3: 
I started with a plan for a web app. I moved to a command line interface to control scope and focus on the main problem. This let me design simple flows, test logic faster, and show clear use of queues, stacks, and hash maps. The trade off is less UI, but stronger proof of algorithmic design and clean data handling. I choose data structures and algorithms that match the goal. I use hash maps for constant time lookups, queues for fair ordering, stacks for undo, and binary search for fast finds. In PetCheckIn, a queue supports first in, first out check-ins, and a stack lets me undo the last action if a mistake occurs. I consider input size, time complexity, and memory cost. For example, a hash map uses more memory but keeps lookups fast. When I refactor code, I favor simple, predictable logic that is easy to test. I write down trade offs so others understand why I picked a structure or pattern.

###### Outcome 4: 
I moved from a basic console sketch to a cleaner web style structure. I defined simple schemas (Customer, Pet, Booking, Inventory) and pushed rules into the data layer so controllers stay thin. I added small indexes to speed common searches and used a single atomic update to prevent double booking. I test small pieces, handle async flows carefully, and use environment variables for configuration. These choices reduce defects, make performance predictable, and keep the system easier to extend. At work, I apply the same approach to processes: define the flow, add checks where they matter, and measure outcomes. The goal is always value, reliability, speed, and easier maintenance.

###### Outcome 5: 
I design with security in mind from the start. I keep secrets in environment variables, restrict database permissions to the minimum, and validate inputs before writes. I plan for failure modes such as race conditions, stale reads, and double booking. I prefer patterns that make risky actions atomic and logged. From my INFOSEC work, I focus on privacy, minimal data collection, and clear audit trails. As I grow, I am adding basic threat modeling and system hardening so I can spot and reduce risks earlier.

Building the ePortfolio pushed me to clean my designs, explain my choices, and plan for real world risks. It also helped me connect my classroom work to my career goals in security and systems. I now have a clear story for employers: I deliver simple, reliable, well documented solutions that teams can trust and extend.


