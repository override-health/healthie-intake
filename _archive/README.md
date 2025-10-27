# Archived Projects

This folder contains the original Blazor UI and .NET API implementations.

## What's Here

- **HealthieIntake.UI** - Blazor WebAssembly UI (Port 5046)
- **HealthieIntake.Api** - ASP.NET Core API (Port 5095)

## Why Archived

As of 2025-10-27, the project moved to a **React + Python FastAPI** stack for better:
- Development speed (instant hot reload)
- Smaller bundle sizes
- Faster iteration
- Modern ecosystem

## Status

Both projects are **fully functional** and at feature parity with the current React/Python stack.

They are kept here for:
- Reference
- Comparison
- Migration rollback (if ever needed)

## Active Stack

The current development stack is:
- **UI:** `HealthieIntake.UI.React` (React + Vite, Port 5173)
- **API:** `HealthieIntake.Api.Py` (Python FastAPI, Port 5096)

## Git History

All commits and history are preserved. You can reference any code from these projects at any time.

Last working commits:
- Blazor UI: `44acff5 - working without BMI`
- Overall: `7be7bf4 - Python API Created`
