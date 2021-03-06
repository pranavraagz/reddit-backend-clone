import { Request, Response } from "express";
import { Comment } from "../../entity/Comment";
import { getManager } from "typeorm";
import { User } from "../../entity/User";
import Joi from "joi";
import { Post } from "../../entity/Post";

export async function commentUnderPost(
  request: Request,
  response: Response
) {
  // request validation
  const schema = Joi.object({
    user_id: Joi.string().uuid().required(),
    post_id: Joi.string().required(),
    text: Joi.string().required(),
  });
  const { value, error } = schema.validate(request.body);
  if (error != null) {
    response.status(400).json({
      error: error,
    });
    return;
  }
  const { post_id, user_id, text } = value;

  // Fetching post
  try {
    var post = await getManager()
      .getRepository(Post)
      .findOne({
        select: ["post_id", "comment_count"],
        where: { post_id: post_id },
      });
    if (!post) {
      response.status(404).json({
        message: "Post does not exist, check post_id",
      });
      return;
    }
  } catch (error) {
    response.status(500).json({ error: error });
    return;
  }

  // Fetching user
  try {
    var user = await getManager()
      .getRepository(User)
      .findOne({
        select: ["user_id", "username"],
        where: { user_id: user_id },
      });
    if (!user) {
      response.status(404).json({
        message: "User does not exist",
      });
      return;
    }
  } catch (error) {
    response.status(500).json({ error: error });
    return;
  }

  // Create comment
  const comment = new Comment();
  comment.post = post;
  comment.created_by = user;
  comment.text = text;
  comment.isRoot = true;

  try {
    var createdComment = await getManager()
      .getRepository(Comment)
      .save(comment);
  } catch (error) {
    response.status(500).json({ error: error });
    return;
  }

  const responseObject: any = createdComment;
  delete responseObject.post;
  delete responseObject.created_by;
  response.status(201).send(createdComment);
}
