const CommentModel = require('../models/CommentModel');

class CommentController{
    static async listCommnet ({
        parent_slug = '',
        slug = '',
        discuss_id = 0,
        replies,
        limit = 10,
        skip = 0
    }){
        try {
            const match = {discuss_id};
            if(slug !== ''){
                match['full_slug'] = new RegExp(slug, 'i');
            }
            const comments = await CommentModel.find(match,{
                _id: 0,// Không lấy trường này và ngược lại
                text: 1,
                slug: 1,
                parent_slug: 1,
                full_slug: 1
            }).sort({full_slug: 1});
            return comments;
        } catch (error) {
            console.error(`[E]: listComment:`, error);
        }
    }

    static async putComment({
        isDEL = 'NO',
        discuss_id = 0,
        text = '',
        parent_slug = '',
        slug = 1000,
        author = '',
        posted = new Date()
    }){
        try {
            if(isDEL === 'YES'){
                await CommentModel.deleteMany();
            }

            let full_slug = `${posted.toISOString()}:${slug}`;
            const parentSlug = await CommentModel.findOne({discuss_id, slug: parent_slug});
            if(parentSlug){
                full_slug = `${parentSlug.full_slug}/${full_slug}`;
                slug = `${parentSlug.slug}/${slug}`;
            }
            const comment = await CommentModel.create({
                parent_slug,
                discuss_id,
                text,
                full_slug,
                slug,
                author
            })
            return comment;
        } catch (error) {
            console.error(`[E]: putComment:`, error);
            
        }
    }
}

module.exports = CommentController;