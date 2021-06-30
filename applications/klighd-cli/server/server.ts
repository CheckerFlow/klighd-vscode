/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { fastify, FastifyPluginAsync, FastifyInstance } from "fastify";
import staticPlugin from "fastify-static";
import websocketPlugin from "fastify-websocket";
import { join } from "path";
import { connectToLanguageServer } from "./ls-connection";

/** Options required by the {@link webSocketHandler} plugin. */
interface WebSocketOptions {
    lsPort?: number;
    lsPath?: string;
}

/** Fastify plugin that forwards incoming websocket connections to a language server. */
const webSocketHandler: FastifyPluginAsync<WebSocketOptions> = async (fastify, opts) => {
    fastify.register(websocketPlugin);

    // Setup WebSocket handler
    fastify.get("/socket", { websocket: true }, (conn) => {
        // Connection established. Spawn a LS for the connection and stream messages
        connectToLanguageServer(conn.socket, fastify.log, opts.lsPort, opts.lsPath);
    });
};

////////////////////////////////////////////////////////////////////////////////

/** Options required to create a server instance. */
interface SetupOptions extends WebSocketOptions {
    /**
     * Change the level for logged messages. Depending on the level certain messages
     * will not be logged. For example, choosing "warn" will not log info or debug messages.
     * If you want to disable logging, choose the level "silent".
     * @see https://github.com/pinojs/pino/blob/master/docs/api.md#loggerlevel-string-gettersetter
     */
    logging: "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "silent";
}

/**
 * Creates and configures a [fastify](https://fastify.io/) server that is
 * able to serve the standalone view and forward websocket connections
 * to a language server.
 */
export function createServer(opts: SetupOptions): FastifyInstance {
    const server = fastify({
        logger: { prettyPrint: true, level: opts.logging },
        disableRequestLogging: true,
    });

    // Serving static file for the website
    server.register(staticPlugin, {
        // Web sources are bundled into the dist folder at the package root
        root: join(__dirname, "../dist"),
    });

    // Handling for incoming websocket requests
    server.register(webSocketHandler, opts);

    return server;
}
