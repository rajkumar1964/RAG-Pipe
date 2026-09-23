import ImageKit, { toFile } from '@imagekit/nodejs';

const client = new ImageKit({
    privateKey:process.env.Imagekit_key,

});

async function uploadimage({buffer,filename,folder=""}){

    const file = await client.files.upload({
        file:await toFile(Buffer.from(buffer)),
        fileName:"filename",
        folder
    })
    return file
}

export default uploadimage
