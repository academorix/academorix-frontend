/**
 * @file devtools-panel-view.component.tsx
 * @module @stackra/devtools/native/components
 * @description Native panel-view dispatcher — mirrors the web
 *   version's shape but only supports `component` and `action`
 *   views. `iframe` is silently degraded to a "not supported"
 *   text block since React Native has no `<iframe>`.
 */

import { type ReactElement, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card } from '@stackra/ui/native';
import type { IDevtoolsAction } from '@stackra/contracts';

import type { DevtoolsPanelViewProps } from './devtools-panel-view.interface';

/** Safe cast — see the web version for the rationale. */
function asReactNode(value: unknown): ReactNode {
  return value as ReactNode;
}

/**
 * Native panel-view.
 */
export function DevtoolsPanelView({ panel }: DevtoolsPanelViewProps): ReactElement {
  switch (panel.view.type) {
    case 'component': {
      return (
        <ScrollView>
          <View style={{ padding: 16 }}>{asReactNode(panel.view.render())}</View>
        </ScrollView>
      );
    }
    case 'action': {
      return (
        <ScrollView>
          <View style={{ gap: 12, padding: 16 }}>
            {panel.view.actions.map((action: IDevtoolsAction) => (
              <Card key={action.id}>
                <Card.Header>
                  <Card.Title>{action.label}</Card.Title>
                  {action.description ? (
                    <Card.Description>{action.description}</Card.Description>
                  ) : null}
                </Card.Header>
                <Card.Footer>
                  <Button
                    variant={action.variant === 'danger' ? 'danger' : 'primary'}
                    onPress={() => {
                      void action.handle();
                    }}
                  >
                    <Button.Label>{action.label}</Button.Label>
                  </Button>
                </Card.Footer>
              </Card>
            ))}
          </View>
        </ScrollView>
      );
    }
    case 'iframe':
    default: {
      return (
        <View style={{ padding: 16 }}>
          <Text>iframe views are not supported on native.</Text>
        </View>
      );
    }
  }
}
