import { Park, ParkSchema } from "@/lib/validations/park";

export class ParksService {
    private readonly API_URL = process.env.NEXT_PUBLIC_API_URL;
    private readonly endpoint = "/parks";

    async getParks(): Promise<Park[]> {
        const response = await fetch(`${this.API_URL}${this.endpoint}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to fetch parks: ${response.statusText}`);
        }

        if (!(data instanceof Array)) {
            throw new Error(`Failed to fetch parks: ${data}`);
        }

        const parks = data.map((park: unknown) => {
            const parsed = ParkSchema.safeParse(park);
            if (!parsed.success) {
                throw new Error(`Failed to parse park: ${park}`);
            }
            return parsed.data;
        });

        return parks;
    }

    async getPark(id: number): Promise<Park> {
        const response = await fetch(`${this.API_URL}${this.endpoint}/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to fetch park: ${response.statusText}`);
        }

        const parsed = ParkSchema.safeParse(data);
        if (!parsed.success) {
            throw new Error(`Failed to parse park: ${data}`);
        }
        return parsed.data;
    }
}

export const parksService = new ParksService();
