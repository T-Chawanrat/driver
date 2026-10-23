import MileageForm, { type MileageProps } from "../components/MileageForm";

export default function MileageClose(props: MileageProps) {
  return <MileageForm mode="close" {...props} />;
}
