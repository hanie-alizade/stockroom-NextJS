import { Avatar } from "@/components/stockroom/avatar";

export function AvatarShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Avatar</h2>
      <div className="gap-md flex">
        <Avatar initials="AB" accessibleName="Alice Brown" />
        <Avatar initials="JD" accessibleName="John Doe" />
        <Avatar initials="XY" accessibleName="X Y" />
      </div>
    </section>
  );
}
