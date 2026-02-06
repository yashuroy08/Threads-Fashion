import dns from 'dns/promises';
import net from 'net';

export class EmailValidationService {
    private static domainCache = new Map<string, boolean>();

    static async validateEmail(email: string): Promise<{ isValid: boolean; message: string }> {
        const domain = email.split('@')[1];
        if (!domain) return { isValid: false, message: 'Invalid email format' };

        // 1. Check Cache
        if (this.domainCache.get(domain)) {
            return { isValid: true, message: 'Domain validated (cached)' };
        }

        try {
            // 2. DNS MX Record Check
            const mxRecords = await dns.resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                return { isValid: false, message: 'No MX records found for domain' };
            }

            // Sort by priority (lowest first)
            const exchange = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

            // 3. SMTP Handshake (simplified for production logic)
            // Note: In some restricted environments, port 25 is blocked.
            // This is a simplified implementation of the handshake logic.
            const isAlive = await this.checkSMTP(exchange, email);

            if (isAlive) {
                this.domainCache.set(domain, true);
                return { isValid: true, message: 'Email address is deliverable' };
            }

            return { isValid: false, message: 'Email address rejected by SMTP server' };
        } catch (error: any) {
            console.error(`Email validation error for ${email}:`, error.message);
            // If DNS fails, it's definitely invalid. Use optimistic fallback for SMTP timeouts.
            if (error.code === 'ENOTFOUND') return { isValid: false, message: 'Domain not found' };
            return { isValid: true, message: 'Validation bypassed due to service timeout' };
        }
    }

    private static checkSMTP(host: string, email: string): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = net.createConnection(25, host);
            socket.setTimeout(5000);

            let step = 0;

            socket.on('data', (data) => {
                const response = data.toString();
                // console.log(`SMTP [${step}]: ${response.trim()}`);

                if (step === 0 && response.startsWith('220')) {
                    socket.write('HELO aura-platform.com\r\n');
                    step = 1;
                } else if (step === 1 && response.startsWith('250')) {
                    socket.write(`MAIL FROM:<noreply@aura-platform.com>\r\n`);
                    step = 2;
                } else if (step === 2 && response.startsWith('250')) {
                    socket.write(`RCPT TO:<${email}>\r\n`);
                    step = 3;
                } else if (step === 3) {
                    if (response.startsWith('250')) {
                        socket.write('QUIT\r\n');
                        resolve(true);
                    } else {
                        socket.write('QUIT\r\n');
                        resolve(false);
                    }
                }
            });

            socket.on('error', () => resolve(true)); // Optimistic on network errors
            socket.on('timeout', () => {
                socket.destroy();
                resolve(true); // Optimistic on timeout
            });
        });
    }
}
