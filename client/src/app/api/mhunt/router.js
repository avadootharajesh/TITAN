import { spawn } from 'child_process';


export function GET(request, res) {

    const { url } = request.query;
    console.log(url);

    if (!url) {
        return new Response('URL is required', { status: 400 });
    }

    const wordlistPath = './resources/fuzz2.txt';
    const threads = 88;

    // Command to run feroxbuster
    const command = './resources/feroxbuster.exe';
    const args = [
        '-u', url,
        '-w', wordlistPath,
        '-s', '200',
        '-n', '-t', threads.toString(),
        '--silent'
    ];

    // Start the feroxbuster process
    const feroxbusterProcess = spawn(command, args);

    // Set up the response for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers to begin the stream

    // Stream the output
    feroxbusterProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        res.write(`data: ${data.toString()}\n\n`);
    });

    // Handle errors
    feroxbusterProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        res.write(`data: Error: ${data.toString()}\n\n`);
    });

    // Handle process exit
    feroxbusterProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Process exited with code ${code}`);
            res.write(`data: Process exited with code ${code}\n\n`);
        }
        res.end();
    });
}