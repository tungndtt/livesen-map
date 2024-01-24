import {
  ReactNode,
  createContext,
  useState,
  useContext,
  useLayoutEffect,
} from "react";

type ResizeContextType = {
  layout: "row" | "column";
  sidebar: "expand" | "collapse";
};

const ResizeContext = createContext<ResizeContextType>({
  layout: "row",
  sidebar: "expand",
});

export default function ResizeProvider(props: { children: ReactNode }) {
  const [layout, setLayout] = useState<"row" | "column">("row");
  const [sidebar, setSidebar] = useState<"expand" | "collapse">("expand");

  useLayoutEffect(() => {
    const resize = () => {
      const width = window.innerWidth;
      if (width >= 1260) {
        setLayout("row");
        setSidebar("expand");
      } else if (width >= 960) {
        setLayout("row");
        setSidebar("collapse");
      } else if (width >= 700) {
        setLayout("column");
        setSidebar("expand");
      } else {
        setLayout("column");
        setSidebar("collapse");
      }
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <ResizeContext.Provider value={{ sidebar, layout }}>
      {props.children}
    </ResizeContext.Provider>
  );
}

export function useResizeContext() {
  return useContext(ResizeContext);
}
