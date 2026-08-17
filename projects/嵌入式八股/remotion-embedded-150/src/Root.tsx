import "./index.css";
import { MyComposition } from "./Composition";
import { ConstQ2Composition } from "./questions/Q002Const";
import { VolatileQ3Composition } from "./questions/Q003Volatile";
import { ExternQ4Composition } from "./questions/Q004Extern";
import { ArrayPointerQ5Composition } from "./questions/Q005ArrayPointer";
import { PointerReferenceQ6Composition } from "./questions/Q006PointerReference";
import { SizeofStrlenQ7Composition } from "./questions/Q007SizeofStrlen";
import { HeapStackQ8Composition } from "./questions/Q008HeapStack";
import { GlobalLocalStaticQ9Composition } from "./questions/Q009GlobalLocalStatic";
import { MallocNewQ10Composition } from "./questions/Q010MallocNew";
import { DeleteArrayQ11Composition } from "./questions/Q011DeleteArray";
import { MemoryLeakQ12Composition } from "./questions/Q012MemoryLeak";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ConstQ2Composition />
      <VolatileQ3Composition />
      <ExternQ4Composition />
      <ArrayPointerQ5Composition />
      <PointerReferenceQ6Composition />
      <SizeofStrlenQ7Composition />
      <HeapStackQ8Composition />
      <GlobalLocalStaticQ9Composition />
      <MallocNewQ10Composition />
      <DeleteArrayQ11Composition />
      <MemoryLeakQ12Composition />
    </>
  );
};
