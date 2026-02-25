export const onRequest = async (context: any) => {
    const bucket = context.env.ASSETS_BUCKET;

    // The data file name in the root of the R2 bucket
    const objectKey = 'soffice.data';

    // Fetch the object from R2
    const obj = await bucket.get(objectKey);

    if (obj === null) {
        return new Response('Not Found in R2', { status: 404 });
    }

    const headers = new Headers();
    // Copy the R2 object HTTP headers
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);

    // Set appropriate content type for data files
    headers.set('Content-Type', 'application/octet-stream');

    // Return the stream
    return new Response(obj.body, { headers });
};
