import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/auth/public.decorator";

@Controller()
@Public()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "SpaciaOS Modular Monolith Backend API",
      status: "operational",
      version: "v1",
      links: {
        frontendApp: "http://localhost:3000",
        interactiveTester: "http://localhost:8000/api/v1/tester",
        healthCheck: "http://localhost:8000/api/v1/health",
        calls: "http://localhost:8000/api/v1/calls",
        leads: "http://localhost:8000/api/v1/leads",
        properties: "http://localhost:8000/api/v1/properties",
      },
    };
  }
}
