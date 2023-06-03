export class BaseClient {
    async postData<T>(url: string = "", data: any = {}): Promise<T> {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data)
        });

        return <T> response.json();
      }

      async getData<T>(url: string = "", headers: any | undefined = undefined): Promise<T> {
        const allHeaders = {...headers, "Content-Type": "application/json"};

        const response = await fetch(url, {
          headers: allHeaders
        });

        return <T> response.json();
      }
}