import express from 'express'
import path from 'path';
import fs from 'fs';
import {env} from './env'

const fallbackRouter = express.Router();
// fallbackRouter.all("*", (req, res) => {
//     res.status(404).send();
// })


export const SpaExpressRouter = (distPath: string) => {
    if (!fs.existsSync(distPath)) {
        console.error("SPA dist path does not exists: " + distPath)
        return fallbackRouter;
    }
    const app = express.Router();

    const indexPath = path.join(path.join(distPath, 'index.html'));
    if (!fs.existsSync(indexPath)) {
        console.error("SPA index.html file does not exists!");
        return fallbackRouter;
    }

    const indexFileContent = fs.readFileSync(indexPath, "utf-8").replace("AppTitle",env.VITE_APP_TITLE);

    // serve files
    app.use(express.static(distPath));

    // serve index.html
    app.get('*', (req, res) => {
        res.send(indexFileContent);
    })

    return app;
}

