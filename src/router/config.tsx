
import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ConnectionTest from "../components/ConnectionTest";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/test",
    element: <ConnectionTest />,
  },
  {
    path: "/add-item",
    element: <Home />,
  },
  {
    path: "/search",
    element: <Home />,
  },
  {
    path: "/locations",
    element: <Home />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
