import MileageForm, { type MileageProps } from "../components/MileageForm";

export default function MileageOpen(props: MileageProps) {
  return <MileageForm mode="open" {...props} />;
}
