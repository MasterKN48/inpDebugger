import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
    .use(swagger({
        documentation: {
            info: {
                title: 'INP Debugger API',
                version: '1.0.0',
                description: 'API for Interaction to Next Paint (INP) analysis and tracking.'
            }
        }
    }))
    .get('/', () => 'INP Debugger API is running')
    .post('/api/analyze', ({ body }) => {
        return { jobId: 'job_' + Math.random().toString(36).substring(7) };
    }, {
        body: t.Object({
            url: t.String(),
            profile: t.Optional(t.Union([t.Literal('desktop'), t.Literal('mobile')])),
            interactions: t.Optional(t.Array(t.Object({
                type: t.String(),
                selector: t.String()
            })))
        })
    })
    .get('/api/results/:jobId', ({ params: { jobId } }) => {
        return { jobId, status: 'pending' };
    })
    .get('/api/history', () => {
        return [];
    })
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
