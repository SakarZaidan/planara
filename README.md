# Planara: Bespoke Architectural Synthesis

![Planara Landing Page](https://github.com/user-attachments/assets/your-image-link-here) <!-- Replace with actual image link if hosting -->

**Planara** is a high-fidelity architectural conceptualization platform that transforms natural language descriptions into professional 2D blueprints and photorealistic 3D room visualizations. By bridging the gap between abstract vision and technical execution, it provides architects and designers with a "multi-stage reasoning" partner.

---

## ✨ Key Features

- **Natural Language to 2D Blueprints**: Convert a simple text prompt (e.g., _"A minimalist Scandinavian loft"_) into a structured, high-fidelity technical drawing.
- **Blueprint-to-3D Synthesis**: Select specific rooms from your generated 2D plan to initialize immersive, photorealistic 3D interior renders.
- **Localized Aesthetic Sourcing**: Integrated "Sourced from IKEA Kuwait" engine that suggests real furniture items matching the generated aesthetic and spatial constraints.
- **Consistency Intelligence**: A proprietary engine that ensures spatial dimensions and material tokens are mathematically synced between the 2D draft and 3D render.
- **Automatic Project Archiving**: Every synthesis—including the JSON kernel, technical blueprints, 3D renders, and furniture suggestions—is automatically saved to your personal Library.

---

## 🏗️ The AI Reasoning Pipeline

The platform operates on a proprietary multi-stage pipeline designed to maintain spatial integrity across visual modalities.

### 1. Semantic Synthesis (Text → JSON Kernel)

- **Engine**: **Gemini 3 Flash**
- **Logic**: Parses creative user descriptions into a "Source of Truth" JSON Kernel, including precise room dimensions, relative coordinates, and logical connections.
- **Style Extraction**: Identifies **Style Seeds** (Mood, Materials, Lighting) to act as global variables for generation.

### 2. AI Blueprint Synthesis (JSON → 2D Imagery)

- **Engine**: **Gemini 2.5 Flash Image** (Nano Banana)
- **Logic**: Interprets the JSON Kernel to render a professional architectural blueprint featuring clean black lines on off-white drafting paper.

### 3. Deep 3D Synthesis (JSON + Tokens → Render)

- **Engine**: **Gemini 2.5 Flash Image**
- **Logic**: Performed on a per-room basis. The AI uses room-specific metadata and extracted style tokens to ensure the final 3D render is mathematically bound to the original plan's footprint.

### 4. Architectural Insight Engine

- **Engine**: **Gemini 3 Flash**
- **Logic**: Performs final design audits, providing interior design optimization suggestions and structural observations.

---

## 🎨 UI/UX Design: "Natural Tones"

The design philosophy mimics a **Digital Design Studio**—a place of focus, craftsmanship, and tactile interaction.

- **Palette**: An earthy scheme consisting of **Sage Green (#8A9A8B)**, **Clay (#B38B6D)**, **Ink (#32352C)**, and **Sand (#F2EFE8)**.
- **Typography**:
  - _Display_: **Georgia Serif (Italic)** for an editorial, journal-like feel.
  - _System_: **Helvetica Neue / Inter** for technical data.
- **Tactility**: High-blur **Glassmorphism** surfaces with a 24px radius and smooth motion-layout transitions.

---

## 🛠️ Technical Stack

| Layer                | Technology                                        |
| :------------------- | :------------------------------------------------ |
| **Backend**          | ASP.NET Core 8 Web API                            |
| **Frontend**         | React 19 + Vite                                   |
| **Database/Auth**    | PostgreSQL via Supabase (Real-time subscriptions) |
| **State Management** | Zustand (Global Architectural Kernel)             |
| **Data Fetching**    | TanStack Query (React Query)                      |
| **Styling**          | Tailwind CSS v4 + shadcn                          |
| **Animations**       | Framer Motion (motion/react)                      |
| **Icons**            | Lucide React                                      |

---

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js (v18+)
- Gemini AI API Key
- Supabase Account (for DB and Auth)

### Installation

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/your-username/planara.git
    cd planara
    ```

2.  **Frontend Setup**

    ```bash
    cd client
    npm install
    npm run dev
    ```

3.  **Backend Setup**
    - Configure your `appsettings.json` with your Gemini API Key and Supabase connection string.
    ```bash
    cd server
    dotnet run
    ```

---

## 📂 Project Structure

- `/client`: React 19 frontend with Tailwind v4 and Zustand state management.
- `/server`: ASP.NET Core 8 API handling the AI orchestration and Supabase integration.
- `/shared`: Shared JSON schema definitions for the Architectural Kernel.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

_Created for the intersection of Artificial Intelligence and Architectural Craft._
