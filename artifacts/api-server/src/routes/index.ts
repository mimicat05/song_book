import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import songsRouter from "./songs";
import songVersionsRouter from "./song-versions";
import setlistsRouter from "./setlists";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(songsRouter);
router.use(songVersionsRouter);
router.use(setlistsRouter);
router.use(exportRouter);

export default router;
